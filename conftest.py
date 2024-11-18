import pytest
from unittest.mock import MagicMock, patch
import json
import os
import sys

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
    """Skip browser-dependent tests when SKIP_BROWSER_TESTS is set"""
    if "requires_browser" in item.keywords and os.environ.get('SKIP_BROWSER_TESTS'):
        pytest.skip("Browser tests disabled")

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
    
    # Mock evaluate method
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

    # Mock set_score method
    def mock_set_score(new_score):
        state['score'] = new_score
        element = MagicMock()
        element.text_content = str(new_score)
        state['elements']['#currentScore'] = element

    page.evaluate = MagicMock(side_effect=mock_evaluate)
    page.set_score = mock_set_score
    
    # Mock locator
    def mock_locator(selector):
        if selector not in state['elements']:
            element = MagicMock()
            element.text_content = str(state['score']) if selector == '#currentScore' else ""
            element.is_visible = MagicMock(return_value=True)
            state['elements'][selector] = element
        return state['elements'][selector]
    
    page.locator = MagicMock(side_effect=mock_locator)
    page.state = state
    
    return page

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
        'collectibles': [],
        'players': {},
        'dragons': []
    }

@pytest.fixture
def mock_socket():
    """Mock socket.io instance for testing"""
    socket = MagicMock()
    socket.emit = MagicMock()
    socket.on = MagicMock()
    socket.connected = True
    socket.sid = 'test-sid'
    return socket
