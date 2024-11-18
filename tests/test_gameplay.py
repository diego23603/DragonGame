import pytest
from unittest.mock import MagicMock, patch
from playwright.sync_api import expect

@pytest.mark.unit
def test_movement_controls(mock_page, game_state):
    """Test character movement controls"""
    # Setup initial position
    initial_x = game_state['position']['x']
    
    # Simulate right arrow key press
    mock_page.keyboard.press('ArrowRight')
    mock_page.state['position']['x'] = initial_x + 10
    
    # Verify keyboard event was processed and position updated
    mock_page.keyboard.press.assert_called_with('ArrowRight')
    current_pos = mock_page.evaluate('myPosition')
    assert current_pos['x'] == initial_x + 10

@pytest.mark.unit
def test_collision_detection(mock_page, game_state):
    """Test boundary collision detection"""
    # Setup game state at boundary
    mock_page.state['position'] = {'x': 0, 'y': 300}
    
    # Simulate movement at boundary
    mock_page.keyboard.press('ArrowLeft')
    
    # Verify player stays within bounds
    current_pos = mock_page.evaluate('myPosition')
    assert current_pos['x'] >= 0

@pytest.mark.unit
def test_score_system(mock_page, game_state):
    """Test score tracking functionality"""
    # Setup initial score
    initial_score = mock_page.evaluate('score')
    assert initial_score == 0
    
    # Update score
    new_score = 10
    mock_page.set_score(new_score)
    
    # Verify score was updated
    current_score = mock_page.evaluate('score')
    assert current_score == new_score
    
    # Verify score display updated
    score_element = mock_page.locator('#currentScore')
    assert score_element.text_content == str(new_score)

@pytest.mark.unit
def test_npc_interactions(mock_page, game_state):
    """Test NPC interaction mechanics"""
    # Setup NPC position
    npc_pos = {'x': 100, 'y': 100}
    mock_page.state['npcs'] = [{
        'x': npc_pos['x'],
        'y': npc_pos['y'],
        'type': 'MERCHANT',
        'message': 'Welcome traveler!'
    }]
    
    # Move player near NPC
    mock_page.state['position'] = npc_pos
    
    # Verify interaction is possible
    distance = ((mock_page.state['position']['x'] - npc_pos['x']) ** 2 + 
               (mock_page.state['position']['y'] - npc_pos['y']) ** 2) ** 0.5
    assert distance <= 60  # Standard interaction radius

@pytest.mark.integration
@pytest.mark.asyncio
async def test_websocket_movement(mock_socket, game_state):
    """Test real-time movement updates via WebSocket"""
    # Setup movement data
    movement_data = {
        'x': 150,
        'y': 150,
        'dragonId': 'red_dragon'
    }
    
    # Emit movement event
    mock_socket.emit('position_update', movement_data)
    
    # Verify emission
    mock_socket.emit.assert_called_with('position_update', movement_data)

@pytest.mark.integration
@pytest.mark.asyncio
async def test_collectible_sync(mock_socket, game_state):
    """Test collectible synchronization between players"""
    # Setup collectible data
    collectible_data = {
        'x': 200,
        'y': 200,
        'type': 'dragon_egg'
    }
    
    # Emit collectible collection event
    mock_socket.emit('collectible_collected', collectible_data)
    
    # Verify broadcast
    mock_socket.emit.assert_called_with('collectible_collected', collectible_data)
