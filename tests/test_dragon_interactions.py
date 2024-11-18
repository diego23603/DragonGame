from playwright.sync_api import Page, expect

def test_dragon_selection_ui(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for dragon options to be loaded
    page.wait_for_selector('#dragonOptions')
    
    # Verify all three dragons are present
    dragon_options = page.locator('.dragon-option')
    expect(dragon_options).to_have_count(3)
    
    # Check if dragon names are correct
    dragons = ['Red Fire Dragon', 'Blue Ice Dragon', 'Green Forest Dragon']
    for dragon in dragons:
        expect(page.get_by_text(dragon)).to_be_visible()
    
    # Select first dragon
    page.locator('.dragon-option').first.click()
    
    # Verify selection feedback
    expect(page.locator('.alert-success')).to_be_visible()
    expect(page.locator('.selected-dragon')).to_be_visible()

def test_dragon_persistence(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for dragon options
    page.wait_for_selector('#dragonOptions')
    
    # Select a dragon
    page.locator('.dragon-option').first.click()
    
    # Refresh the page
    page.reload()
    
    # Verify the selection persists
    expect(page.locator('.selected-dragon')).to_be_visible()

def test_dragon_sprite_rendering(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for dragon options
    page.wait_for_selector('#dragonOptions')
    
    # Select a dragon
    page.locator('.dragon-option').first.click()
    
    # Wait for canvas to be ready
    page.wait_for_selector('canvas')
    
    # Verify character sprite is visible on canvas
    # Note: Since canvas testing is limited, we check if canvas exists and no errors in console
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text()) if msg.type == 'error' else None)
    
    # Wait a moment for rendering
    page.wait_for_timeout(1000)
    
    # Assert no console errors during rendering
    assert len(console_errors) == 0, f"Console errors during rendering: {console_errors}"
