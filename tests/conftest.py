import pytest
from unittest.mock import MagicMock, patch
import json
import os
import sys
from playwright.sync_api import Error as PlaywrightError

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "requires_browser: mark test that requires a real browser"
    )
    config.addinivalue_line(
        "markers", "requires_display: mark test that requires a display server"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "ui: mark test as a UI test"
    )

def pytest_runtest_setup(item):
    """Skip browser-dependent tests when browser dependencies are missing"""
    # Check for browser dependency markers
    if "requires_browser" in item.keywords:
        try:
            # Try importing playwright
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                try:
                    browser = p.chromium.launch()
                    browser.close()
                except PlaywrightError as e:
                    if "Missing dependencies" in str(e):
                        pytest.skip(f"Browser dependencies missing: {str(e)}")
                    else:
                        pytest.skip(f"Browser launch failed: {str(e)}")
        except ImportError:
            pytest.skip("Playwright not installed")
        except Exception as e:
            pytest.skip(f"Browser test setup failed: {str(e)}")

@pytest.fixture
def mock_browser():
    """Mock browser for testing without actual browser dependencies"""
    browser = MagicMock()
    context = MagicMock()
    page = MagicMock()
    
    # Setup chain of mock objects
    browser.new_context.return_value = context
    context.new_page.return_value = page
    
    # Add common browser methods
    page.goto = MagicMock()
    page.click = MagicMock()
    page.fill = MagicMock()
    page.wait_for_selector = MagicMock()
    page.wait_for_timeout = MagicMock()
    
    return browser

@pytest.fixture
def mock_page(mock_browser):
    """Enhanced mock page with proper state management for testing"""
    page = MagicMock()
    
    # State management
    state = {
        'score': 0,
        'position': {'x': 400, 'y': 300},
        'elements': {},
        'local_storage': {},
        'console_messages': []
    }
    
    def mock_evaluate(expression, *args):
        if isinstance(expression, str):
            if expression == 'score':
                return state['score']
            elif expression == 'myPosition':
                return state['position']
            elif expression.startswith('localStorage.getItem'):
                key = expression.split('"')[1]
                return state['local_storage'].get(key)
            elif expression.startswith('localStorage.setItem'):
                key = expression.split('"')[1]
                value = args[0] if args else None
                state['local_storage'][key] = value
                return None
        return None

    def mock_set_score(new_score):
        state['score'] = new_score
        
        # Update score display element
        element = MagicMock()
        element.text_content = str(new_score)
        state['elements']['#currentScore'] = element

    page.evaluate = MagicMock(side_effect=mock_evaluate)
    page.set_score = mock_set_score
    
    def mock_locator(selector):
        if selector not in state['elements']:
            element = MagicMock()
            element.text_content = str(state['score']) if selector == '#currentScore' else ""
            element.is_visible = MagicMock(return_value=True)
            state['elements'][selector] = element
        return state['elements'][selector]
    
    page.locator = MagicMock(side_effect=mock_locator)
    
    # Console handling
    def mock_console_handler(event_type, handler):
        state['console_messages'].append(handler)
    
    page.on = MagicMock(side_effect=mock_console_handler)
    page.state = state  # Make state accessible to tests
    
    return page

@pytest.fixture
def mock_socket(mock_socket_io):
    """Alias for mock_socket_io to maintain compatibility"""
    return mock_socket_io

@pytest.fixture
def mock_socket_io():
    """Mock socket.io instance for testing"""
    socket_io = MagicMock()
    socket_io.emit = MagicMock()
    socket_io.on = MagicMock()
    socket_io.connected = True
    socket_io.sid = 'test-sid'

    def mock_emit(event, data=None, callback=None):
        if callback:
            callback({'status': 'success'})
        return True

    socket_io.emit.side_effect = mock_emit
    return socket_io

@pytest.fixture
def game_state():
    """Fixture to provide comprehensive initial game state"""
    return {
        'score': 0,
        'position': {'x': 400, 'y': 300},
        'weather': 'clear',
        'time': 12,
        'isAutomatic': True,
        'manualTime': 12,
        'collectibles': [
            {
                'x': 200,
                'y': 200,
                'type': 'dragon_egg',
                'collected': False,
                'value': 30
            }
        ],
        'players': {},
        'dragons': [
            {
                "id": "red_dragon",
                "name": "Red Fire Dragon",
                "sprite": "/static/images/dragons/red_dragon.svg",
                "size": 48,
                "description": "A powerful fire-breathing dragon"
            }
        ],
        'npcs': [
            {
                'x': 100,
                'y': 100,
                'type': 'MERCHANT',
                'message': 'Welcome traveler! Want to trade?'
            }
        ]
    }

@pytest.fixture
def mock_ga_tracking():
    """Mock GA tracking for all tests"""
    ga_mock = MagicMock()
    ga_mock.track_event = MagicMock()
    ga_mock.tracking_enabled = True
    with patch('app.ga_tracking', ga_mock):
        yield ga_mock
