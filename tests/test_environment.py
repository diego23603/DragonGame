from playwright.sync_api import Page, expect

def test_day_night_cycle(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for time display
    page.wait_for_selector('#timeDisplay')
    
    # Test manual mode toggle
    page.click('#toggleDayNight')
    expect(page.locator('#toggleDayNight')).to_contain_text('Switch to Automatic Mode')
    
    # Verify manual controls appear
    expect(page.locator('#manualControls')).to_be_visible()
    
    # Test time adjustment
    initial_time = page.locator('#timeDisplay').text_content()
    page.click('text=+1 Hour')
    page.wait_for_timeout(500)  # Wait for update
    final_time = page.locator('#timeDisplay').text_content()
    assert initial_time != final_time, "Time should change after adjustment"

def test_weather_effects(page: Page):
    # Navigate to the page
    page.goto('/')
    
    # Wait for weather system to initialize
    page.wait_for_selector('canvas')
    
    # Weather effects are visual and in canvas, we can verify no console errors
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text()) if msg.type == 'error' else None)
    
    # Wait for potential weather changes
    page.wait_for_timeout(2000)
    
    # Assert no console errors during weather rendering
    assert len(console_errors) == 0, f"Console errors during weather effects: {console_errors}"
