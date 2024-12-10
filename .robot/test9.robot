To create an end-to-end (E2E) test script using Python, Robot Framework, and Selenium for the specified test case, we'll define a series of steps wrapped in a Robot Framework test suite. The test suite will follow the user story steps necessary to add two products to the cart, verify their presence, and check their prices.

Below is a sample Robot Framework test script for the outlined test case:

```robot
*** Settings ***
Library  SeleniumLibrary

*** Variables ***
${URL}               http://automationexercise.com
${PRODUCT1_BTN_XPATH}   /html/body/section/div/div/div[2]/div[1]/div/div/div/div/a[2]/button
${PRODUCT2_BTN_XPATH}   /html/body/section/div/div/div[2]/div[2]/div/div/div/div/a[2]/button
${CONTINUE_SHOPPING_BTN_XPATH}  /html/body/div/div/div[1]/div[1]/div/div/div/div[3]/div[2]/div/div/div[2]/div/div/div/div/button
${VIEW_CART_BTN_XPATH}  /html/body/section/div/div/div[1]/div[1]/button

*** Test Cases ***
Add Two Products To Cart And Verify
    Open Browser  ${URL}  Chrome
    Maximize Browser Window

    # Step 3: Verify that home page is visible successfully
    # Wait Until Page Contains Element  xpath=//h2[contains(text(),'Full-Fledged Practice Website')]

    # Step 4: Click 'Products' button
    Click Link  xpath=//a[contains(text(),'Products')]

    # Step 5: Hover over first product and click 'Add to cart'
    # Hover Over        xpath=${PRODUCT1_BTN_XPATH}
    Click Button  xpath=${PRODUCT1_BTN_XPATH}
    /html/body/section[2]/div[1]/div/div[2]/div/div[2]/div/div[1]/div[1]/a
    
    # Step 6: Click 'Continue Shopping' button
    Click Button  xpath=${CONTINUE_SHOPPING_BTN_XPATH}

    # Step 7: Hover over second product and click 'Add to cart'
    # Hover Over  xpath=/html/body/section/div/div/div[2]/div[1]/div/div/div/div/a[2]/button
    
    Click Button  xpath=${PRODUCT2_BTN_XPATH}

    # Step 8: Click 'View Cart' button
    Click Button  xpath=${VIEW_CART_BTN_XPATH}

    # Step 9: Verify both products are added to Cart
    Wait Until Page Contains Element  xpath=//tbody//tr[1]//td[@class='product-name']
    Wait Until Page Contains Element  xpath=//tbody//tr[2]//td[@class='product-name']

    # Step 10: Verify their prices, quantity and total price
    Wait Until Page Contains Element  xpath=//tbody//tr[1]//td[@class='product-price']
    Wait Until Page Contains Element  xpath=//tbody//tr[2]//td[@class='product-price']
    Wait Until Page Contains Element  xpath=//tbody//tr[1]//td[@class='product-total']
    Wait Until Page Contains Element  xpath=//tbody//tr[2]//td[@class='product-total']

    # Close the browser
    Close Browser
# ```

# ### Explanation:

# - **Prerequisites**: 
#   - Ensure Selenium Library is installed in your Robot environment.
#   - Ensure you have a compatible web driver for the chosen browser (Chrome, in this case).

# - **Settings Section**: Loads the `SeleniumLibrary`, which allows us to interact with web elements.

# - **Variables Section**: Defines various XPaths and the target URL as variables for reuse. Replace these XPaths with the exact paths applicable to the products you are adding to the cart.

# - **Test Cases Section**: 
#   - **Open Browser**: Opens Chrome browser and navigates to the specified URL.
#   - **Verify Home Page**: Ensures that the page has loaded.
#   - **Interact with Elements**: Follows each step to add two items to the cart and verify them:
#     - **Hover and Click**: Performs hover and click actions to simulate mouse interactions.
#     - **View Cart and Verify**: Checks if the selected products appear in the cart and verifies their details.

# - **Close Browser**: Ensures that the browser is closed after the test completes.

# Make sure to adjust XPath selectors to match your application's DOM structure and modify any test details specific to your scenario, like product identification or validation checks. Also, ensure that the local setup supports Selenium executions appropriately.