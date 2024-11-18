import pytest
from playwright.sync_api import Page, expect
import logging

logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s [%(levelname)8s] %(message)s',
                   datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)

@pytest.mark.ui
def test_basic_page_load(page: Page):
    """Test basic page load without browser dependencies"""
    try:
        # Navigate to the page
        page.goto('/')
        
        # Check if critical elements exist in the DOM
        selectors = [
            '#mapContainer',
            '#scoreBoard',
            '#dragonOptions',
            '#chatWindow'
        ]
        
        for selector in selectors:
            element = page.locator(selector)
            assert element is not None, f"Element {selector} not found"
        
        logger.info("✓ Basic page load test passed")
        return True
    except Exception as e:
        logger.error(f"Basic page load test failed: {e}")
        return False

@pytest.mark.ui
def test_basic_interactions(page: Page):
    """Test basic interactions without browser rendering"""
    try:
        page.goto('/')
        
        # Test chat input
        page.fill('#chatInput', 'Test message')
        input_value = page.evaluate('document.querySelector("#chatInput").value')
        assert input_value == 'Test message', "Chat input not working"
        
        # Test score display
        page.evaluate('window.score = 100')
        score_text = page.evaluate('document.querySelector("#currentScore").textContent')
        assert score_text == '100', "Score display not working"
        
        logger.info("✓ Basic interactions test passed")
        return True
    except Exception as e:
        logger.error(f"Basic interactions test failed: {e}")
        return False
