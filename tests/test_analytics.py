from playwright.sync_api import Page, expect
import re

def test_analytics_initialization(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Check if GA script is loaded
    expect(page.locator('script[src*="googletagmanager.com"]')).to_be_attached()
    
    # Check console logs for GA initialization
    logs = []
    page.on('console', lambda msg: logs.append(msg.text))
    
    # Wait for GA initialization message
    page.wait_for_function('window.ga !== undefined')
    assert any('GA4 initialized' in log for log in logs)

def test_game_session_tracking(page: Page):
    page.goto('/')
    
    # Monitor GA events
    analytics_events = []
    page.on('console', lambda msg: analytics_events.append(msg.text) if 'Tracking game session' in msg.text else None)
    
    # Start game session
    page.wait_for_selector('#playButton')
    page.click('#playButton')
    
    # Verify game session start event
    assert any('Tracking game session: start' in event for event in analytics_events)
    
    # End game session
    page.evaluate('window.dispatchEvent(new Event("beforeunload"))')
    assert any('Tracking game session: end' in event for event in analytics_events)

def test_dragon_selection_tracking(page: Page):
    page.goto('/')
    
    # Monitor GA events
    analytics_events = []
    page.on('console', lambda msg: analytics_events.append(msg.text) if 'Tracking dragon selection' in msg.text else None)
    
    # Select a dragon
    page.wait_for_selector('.dragon-option')
    page.click('.dragon-option:first-child')
    
    # Verify dragon selection event
    assert any('Tracking dragon selection' in event for event in analytics_events)

def test_chat_message_tracking(page: Page):
    page.goto('/')
    
    # Monitor GA events
    analytics_events = []
    page.on('console', lambda msg: analytics_events.append(msg.text) if 'Tracking chat message' in msg.text else None)
    
    # Send a chat message
    page.fill('#chatInput', 'Test message')
    page.click('#sendMessage')
    
    # Verify chat message event
    assert any('Tracking chat message' in event for event in analytics_events)

def test_weather_change_tracking(page: Page):
    page.goto('/')
    
    # Monitor GA events
    analytics_events = []
    page.on('console', lambda msg: analytics_events.append(msg.text) if 'Tracking weather change' in msg.text else None)
    
    # Wait for weather change
    page.wait_for_timeout(60000)  # Wait for weather change interval
    
    # Verify weather change event
    assert any('Tracking weather change' in event for event in analytics_events)

def test_score_tracking(page: Page):
    page.goto('/')
    
    # Monitor GA events
    analytics_events = []
    page.on('console', lambda msg: analytics_events.append(msg.text) if 'Tracking score update' in msg.text else None)
    
    # Play game and collect items
    page.wait_for_selector('#playButton')
    page.click('#playButton')
    
    # Wait for score update
    page.wait_for_selector('#currentScore:not(:empty)')
    
    # Verify score tracking event
    assert any('Tracking score update' in event for event in analytics_events)
