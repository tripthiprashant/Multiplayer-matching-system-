"""
GameConsumer — Real-time Tic-Tac-Toe via WebSocket
Each match_id maps to one room. Backend owns all game state.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Match, Player
from . import services

# In-memory game state: { match_id: GameRoom }
ROOMS = {}

WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
    [0, 4, 8], [2, 4, 6],             # diagonals
]


class GameRoom:
    def __init__(self, match_id):
        self.match_id  = match_id
        self.board     = [''] * 9
        self.players   = {}        # channel_name -> player_id
        self.symbols   = {}        # player_id -> 'X' or 'O'
        self.turn      = 'X'
        self.status    = 'waiting' # waiting | playing | finished
        self.winner_id = None

    def add_player(self, channel_name, player_id):
        if len(self.players) >= 2:
            return False
        self.players[channel_name] = player_id
        if len(self.players) == 1:
            self.symbols[player_id] = 'X'
        else:
            self.symbols[player_id] = 'O'
            self.status = 'playing'
        return True

    def remove_player(self, channel_name):
        self.players.pop(channel_name, None)

    def get_player_id(self, channel_name):
        return self.players.get(channel_name)

    def make_move(self, player_id, position):
        """Returns (ok, error_msg)"""
        if self.status != 'playing':
            return False, 'Game not in progress.'
        symbol = self.symbols.get(player_id)
        if not symbol:
            return False, 'You are not in this game.'
        if symbol != self.turn:
            return False, 'Not your turn.'
        if position < 0 or position > 8:
            return False, 'Invalid position.'
        if self.board[position] != '':
            return False, 'Cell already taken.'
        self.board[position] = symbol
        return True, None

    def check_winner(self):
        for line in WIN_LINES:
            a, b, c = line
            if self.board[a] and self.board[a] == self.board[b] == self.board[c]:
                return self.board[a]  # 'X' or 'O'
        return None

    def is_draw(self):
        return all(cell != '' for cell in self.board)

    def switch_turn(self):
        self.turn = 'O' if self.turn == 'X' else 'X'

    def get_winner_player_id(self, winning_symbol):
        for pid, sym in self.symbols.items():
            if sym == winning_symbol:
                return pid
        return None

    def state_dict(self):
        return {
            'board':  self.board,
            'turn':   self.turn,
            'status': self.status,
            'symbols': {str(k): v for k, v in self.symbols.items()},
        }


class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.match_id  = self.scope['url_route']['kwargs']['match_id']
        self.room_name = f'game_{self.match_id}'
        self.player_id = None

        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        room = ROOMS.get(self.match_id)
        if room:
            room.remove_player(self.channel_name)
            # Notify opponent
            if room.status == 'playing':
                room.status = 'finished'
                await self.channel_layer.group_send(self.room_name, {
                    'type': 'game_message',
                    'payload': {
                        'type': 'end',
                        'result': 'disconnect',
                        'message': 'Opponent disconnected. You win!',
                        'winner_id': None,
                    }
                })
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON.')
            return

        msg_type = data.get('type')

        if msg_type == 'join':
            await self.handle_join(data)
        elif msg_type == 'move':
            await self.handle_move(data)
        else:
            await self.send_error(f'Unknown message type: {msg_type}')

    # ── Handlers ──────────────────────────────────────────────────────────────

    async def handle_join(self, data):
        player_id = data.get('player_id')
        if not player_id:
            await self.send_error('player_id required.')
            return

        # Validate player belongs to this match
        valid = await self.validate_player(int(player_id), int(self.match_id))
        if not valid:
            await self.send_error('You are not part of this match.')
            return

        self.player_id = int(player_id)

        # Get or create room
        if self.match_id not in ROOMS:
            ROOMS[self.match_id] = GameRoom(self.match_id)
        room = ROOMS[self.match_id]

        ok = room.add_player(self.channel_name, self.player_id)
        if not ok:
            await self.send_error('Room is full.')
            return

        symbol = room.symbols[self.player_id]

        # Tell this player their symbol
        await self.send(text_data=json.dumps({
            'type': 'joined',
            'symbol': symbol,
            'player_id': self.player_id,
            'state': room.state_dict(),
        }))

        # When 2nd player joins, broadcast start to both
        if room.status == 'playing':
            await self.channel_layer.group_send(self.room_name, {
                'type': 'game_message',
                'payload': {
                    'type': 'start',
                    'state': room.state_dict(),
                    'message': 'Game started! X goes first.',
                }
            })

    async def handle_move(self, data):
        if not self.player_id:
            await self.send_error('Join the room first.')
            return

        position = data.get('position')
        if position is None:
            await self.send_error('position required.')
            return

        room = ROOMS.get(self.match_id)
        if not room:
            await self.send_error('Room not found.')
            return

        ok, err = room.make_move(self.player_id, int(position))
        if not ok:
            await self.send_error(err)
            return

        # Check win / draw
        winning_symbol = room.check_winner()
        if winning_symbol:
            winner_pid = room.get_winner_player_id(winning_symbol)
            room.status    = 'finished'
            room.winner_id = winner_pid

            # Update ELO via existing service
            await self.record_result(int(self.match_id), winner_pid)

            await self.channel_layer.group_send(self.room_name, {
                'type': 'game_message',
                'payload': {
                    'type': 'end',
                    'result': 'win',
                    'winner_id': winner_pid,
                    'winning_symbol': winning_symbol,
                    'state': room.state_dict(),
                }
            })
            return

        if room.is_draw():
            room.status = 'finished'
            await self.channel_layer.group_send(self.room_name, {
                'type': 'game_message',
                'payload': {
                    'type': 'end',
                    'result': 'draw',
                    'winner_id': None,
                    'state': room.state_dict(),
                }
            })
            return

        room.switch_turn()
        await self.channel_layer.group_send(self.room_name, {
            'type': 'game_message',
            'payload': {
                'type': 'update',
                'state': room.state_dict(),
                'last_move': {'player_id': self.player_id, 'position': position},
            }
        })

    # ── Channel layer handler ─────────────────────────────────────────────────

    async def game_message(self, event):
        await self.send(text_data=json.dumps(event['payload']))

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def send_error(self, message):
        await self.send(text_data=json.dumps({'type': 'error', 'message': message}))

    @database_sync_to_async
    def validate_player(self, player_id, match_id):
        try:
            match = Match.objects.get(id=match_id)
            return match.player1_id == player_id or match.player2_id == player_id
        except Match.DoesNotExist:
            return False

    @database_sync_to_async
    def record_result(self, match_id, winner_id):
        try:
            result = services.record_match_result(match_id, winner_id)
            return result
        except Exception:
            return None
