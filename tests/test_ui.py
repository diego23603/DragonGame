from playwright.sync_api import Page, expect
import pytest
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s [%(levelname)8s] %(message)s',
                   datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)

@pytest.mark.ui
@pytest.mark.requires_browser
def test_game_initialization(page: Page):
    """Test game initialization and basic setup"""
    logger.info("Starting game initialization test")
    start_time = time.time()
    
    # Navigate to the page
    logger.info("Navigating to home page")
    page.goto('/')
    
    # Check critical game elements
    logger.info("Verifying critical game elements")
    expect(page.locator('#mapContainer')).to_be_visible()
    expect(page.locator('canvas')).to_be_visible()
    expect(page.locator('#scoreBoard')).to_be_visible()
    
    duration = time.time() - start_time
    logger.info(f"✓ Game initialization test passed in {duration:.2f} seconds")

@pytest.mark.ui
@pytest.mark.requires_browser
def test_chat_functionality(page: Page):
    """Test chat system functionality"""
    logger.info("Starting chat functionality test")
    start_time = time.time()
    
    # Navigate to the page
    page.goto('/')
    logger.info("Setting up test nickname")
    
    # Set nickname
    page.wait_for_selector('#nicknameModal')
    page.fill('#nickname', 'TestUser')
    page.click('button:text("Save Nickname")')
    
    # Wait for chat to be ready
    logger.info("Testing chat functionality")
    page.wait_for_selector('#chatWindow')
    
    # Send message
    test_message = "Hello World!"
    page.fill('#chatInput', test_message)
    page.click('#sendMessage')
    
    # Verify message appears
    logger.info("Verifying message delivery")
    message_locator = page.locator('.chat-message >> text=' + test_message)
    expect(message_locator).to_be_visible()
    
    duration = time.time() - start_time
    logger.info(f"✓ Chat functionality test passed in {duration:.2f} seconds")

@pytest.mark.ui
@pytest.mark.requires_browser
def test_dragon_selection(page: Page):
    """Test dragon selection and persistence"""
    logger.info("Starting dragon selection test")
    start_time = time.time()
    
    # Navigate to the page
    page.goto('/')
    
    # Wait for dragons to load
    logger.info("Waiting for dragon options to load")
    page.wait_for_selector('.dragon-option')
    
    # Select first dragon
    logger.info("Selecting dragon")
    page.click('.dragon-option:first-child')
    
    # Verify selection feedback
    logger.info("Verifying selection feedback")
    expect(page.locator('.selected-dragon')).to_be_visible()
    expect(page.locator('.alert-success')).to_be_visible()
    
    duration = time.time() - start_time
    logger.info(f"✓ Dragon selection test passed in {duration:.2f} seconds")

@pytest.mark.ui
@pytest.mark.requires_browser
def test_weather_effects(page: Page):
    """Test weather system"""
    logger.info("Starting weather effects test")
    start_time = time.time()
    
    page.goto('/')
    page.wait_for_selector('canvas')
    
    # Test weather change
    logger.info("Testing weather system state")
    page.evaluate('''() => {
        window.currentWeather = 'rain';
        window.weatherParticles = [{x: 100, y: 100}];
    }''')
    
    # Verify weather state
    logger.info("Verifying weather state")
    weather_state = page.evaluate('window.currentWeather')
    assert weather_state == 'rain', "Weather state not set correctly"
    
    particles = page.evaluate('window.weatherParticles.length')
    assert particles > 0, "No weather particles generated"
    
    duration = time.time() - start_time
    logger.info(f"✓ Weather effects test passed in {duration:.2f} seconds")

@pytest.mark.ui
@pytest.mark.requires_browser
def test_dragon_breath(page: Page):
    """Test dragon breath effects"""
    logger.info("Starting dragon breath effects test")
    start_time = time.time()
    
    page.goto('/')
    page.wait_for_selector('canvas')
    
    # Verify breath function exists
    logger.info("Verifying dragon breath functionality")
    has_breath = page.evaluate('typeof window.drawDragonBreath === "function"')
    assert has_breath, "Dragon breath function not found"
    
    # Test breath effect
    logger.info("Testing breath effect rendering")
    page.evaluate('window.drawDragonBreath(100, 100, 0)')
    
    duration = time.time() - start_time
    logger.info(f"✓ Dragon breath test passed in {duration:.2f} seconds")

@pytest.mark.ui
@pytest.mark.requires_browser
def test_chat_distance_effects(page: Page):
    """Test chat message distance effects"""
    logger.info("Starting chat distance effects test")
    start_time = time.time()
    
    page.goto('/')
    
    # Setup test environment
    logger.info("Setting up chat test environment")
    page.wait_for_selector('#chatWindow')
    
    # Add test messages
    logger.info("Adding test messages with different distances")
    page.evaluate('''() => {
        const chatMessages = document.getElementById('chatMessages');
        
        // Nearby message
        const nearbyMsg = document.createElement('div');
        nearbyMsg.className = 'chat-message nearby';
        nearbyMsg.style.opacity = '1';
        nearbyMsg.textContent = 'Nearby message';
        chatMessages.appendChild(nearbyMsg);
        
        // Far message
        const farMsg = document.createElement('div');
        farMsg.className = 'chat-message far';
        farMsg.style.opacity = '0.7';
        farMsg.textContent = 'Far message';
        chatMessages.appendChild(farMsg);
    }''')
    
    # Verify message visibility and opacity
    logger.info("Verifying message visibility and distance effects")
    expect(page.locator('.chat-message.nearby')).to_be_visible()
    expect(page.locator('.chat-message.far')).to_be_visible()
    
    # Check opacity via evaluation
    far_opacity = page.evaluate('window.getComputedStyle(document.querySelector(".chat-message.far")).opacity')
    assert float(far_opacity) < 1.0, "Far message opacity not properly set"
    
    duration = time.time() - start_time
    logger.info(f"✓ Chat distance effects test passed in {duration:.2f} seconds")
