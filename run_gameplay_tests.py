#!/usr/bin/env python3
import subprocess
import sys
import os

def run_gameplay_tests():
    """Run gameplay-specific tests with clear output formatting"""
    print("\n=== Running Gameplay Tests ===\n")
    
    # Set environment variable to skip browser tests if dependencies are missing
    os.environ['SKIP_BROWSER_TESTS'] = '1'
    
    try:
        # Run pytest with gameplay tests
        result = subprocess.run(
            ['pytest', 'tests/test_gameplay.py', '-v', '--no-header',
             '--color=yes'],
            capture_output=True,
            text=True
        )
        
        # Print test results with formatting
        output_lines = result.stdout.split('\n')
        for line in output_lines:
            if 'PASSED' in line:
                print('\033[92m' + line + '\033[0m')  # Green for passed
            elif 'FAILED' in line:
                print('\033[91m' + line + '\033[0m')  # Red for failed
            elif 'SKIPPED' in line:
                print('\033[93m' + line + '\033[0m')  # Yellow for skipped
            else:
                print(line)
        
        # Print summary
        print("\n=== Test Summary ===")
        if result.returncode == 0:
            print("\033[92mAll gameplay tests passed!\033[0m")
        else:
            print("\033[91mSome tests failed. Check output above for details.\033[0m")
        
        return result.returncode
        
    except Exception as e:
        print(f"\033[91mError running tests: {e}\033[0m")
        return 1

if __name__ == '__main__':
    sys.exit(run_gameplay_tests())
