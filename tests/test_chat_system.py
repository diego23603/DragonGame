from playwright.sync_api import Page, expect
import time

def test_chat_interface_elements(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Verify chat container exists
    expect(page.locator('#chatWindow')).to_be_visible()
    
    # Check chat input elements
    expect(page.locator('#chatInput')).to_be_visible()
    expect(page.locator('#sendMessage')).to_be_visible()

def test_nickname_modal(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for nickname modal
    page.wait_for_selector('#nicknameModal')
    
    # Input invalid nickname
    page.fill('#nickname', 'a')
    page.click('text=Save Nickname')
    
    # Verify error message
    expect(page.locator('.invalid-feedback')).to_be_visible()
    
    # Input valid nickname
    page.fill('#nickname', 'TestUser123')
    page.click('text=Save Nickname')
    
    # Verify nickname is saved
    expect(page.locator('#currentUser')).to_contain_text('TestUser123')

def test_chat_message_sending(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Set nickname first
    page.wait_for_selector('#nicknameModal')
    page.fill('#nickname', 'TestUser123')
    page.click('text=Save Nickname')
    
    # Type and send a message
    test_message = "Hello, Dragon World!"
    page.fill('#chatInput', test_message)
    page.click('#sendMessage')
    
    # Verify message appears in chat
    expect(page.locator('.chat-message')).to_contain_text(test_message)

def test_chat_controls(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Test minimize/maximize functionality
    page.click('.minimize-chat')
    expect(page.locator('.chat-body')).not_to_be_visible()
    
    page.click('.minimize-chat')
    expect(page.locator('.chat-body')).to_be_visible()
    
    # Test maximize functionality
    page.click('.maximize-chat')
    expect(page.locator('#chatWindow')).to_have_class('maximized')
