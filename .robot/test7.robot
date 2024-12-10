# To create an end-to-end test script using Python, Robot Framework, and Selenium for the described Test Case 21: "Add review on product," follow the steps below. This script will automate the interactions required to add a review on a product.

# **1. Installation Requirements:**

# Before you begin, ensure you have the following installed:

# - Python: [Download and install Python](https://www.python.org/downloads/)
# - Robot Framework: Install via pip with `pip install robotframework`
# - Selenium Library for Robot Framework: Install with `pip install robotframework-seleniumlibrary`
# - Webdriver for the browser you are using, for example, ChromeDriver for Chrome. You may need to place it in your system's PATH.

# **2. Create a Test Suite File:**

# You typically create a `.robot` file for your test suite, so let's name it `add_review_test.robot`.

# ```robot
*** Settings ***
Library  SeleniumLibrary
*** Variables ***
${URL}                http://automationexercise.com
${BROWSER}            Chrome
${PRODUCTS_BUTTON}    xpath=//a[text()='products']
${VIEW_PRODUCT_BUTTON}         xpath=/html/body/section[2]/div/div/div[2]/div/div[2]/div/div[2]/ul/li/a
${WRITE_REVIEW_HEADER}         xpath=//h2[text()='Write Your Review']
${REVIEW_NAME}        xpath=//input[@id='name']
${REVIEW_EMAIL}       xpath=//input[@id='email']
${REVIEW_TEXT}        xpath=//textarea[@id='review']
${SUBMIT_REVIEW_BUTTON}         xpath=//button[@id='button-review']
${SUCCESS_MESSAGE}    xpath=//span[contains(text(),'Thank you for your review.')]

*** Test Cases ***
Add Review On Product
    [Documentation]    Test case to add a review to a product on AutomationExercise website.
    Open Browser    ${URL}  ${BROWSER}
    Click On Products Button
    # Verify Navigation To All Products Page
    Click On View Product Button
    # Verify Write Your Review Is Visible
    Enter Review Details
    Submit Review
    Verify Success Message
    Close Browser

*** Keywords ***
Click On Products Button
    Wait Until Element Is Visible    //*[@id="header"]/div/div/div/div[2]/div/ul/li[2]/a
    Click Element                    //*[@id="header"]/div/div/div/div[2]/div/ul/li[2]/a  

# Verify Navigation To All Products Page
#     Wait Until Page Contains Element    /html/body/section[2]/div/div/div[2]/div/div[3]/div[1]/div[2]/ul
    

Click On View Product Button
    Click Element    ${VIEW_PRODUCT_BUTTON}
#     Wait Until Element Is Visible    ${WRITE_REVIEW_HEADER}

# Verify Write Your Review Is Visible
#     Element Should Be Visible    ${WRITE_REVIEW_HEADER}

Enter Review Details
    Input Text    ${REVIEW_NAME}    Test User
    Input Text    ${REVIEW_EMAIL}   testuser@example.com
    Input Text    ${REVIEW_TEXT}    This is a test review.

Submit Review
    Click Button    ${SUBMIT_REVIEW_BUTTON}

Verify Success Message
    Wait Until Element Is Visible    ${SUCCESS_MESSAGE}
    Element Text Should Be    ${SUCCESS_MESSAGE}    Thank you for your review.
# ```

# **3. Explanation:**

# - **Settings**: Include the required libraries.
# - **Variables**: Define key XPaths and input data as variables for easier maintenance.
# - **Test Cases**: Describe the test case sequence of actions.
# - **Keywords**: Modularize steps into reusable actions for clarity and reuse.

# **4. Running the Test Case:**

# To run the test case, navigate to the directory containing your `.robot` file and execute the following command in your command line or terminal:

# ```shell
# robot add_review_test.robot
# ```

# This will open the specified browser, navigate through the test case steps, and close the browser upon completion while producing an output log showing results for analysis.

# Make sure your browser's driver (e.g., ChromeDriver if using Chrome) is up-to-date and installed properly. If not, update it from the official WebDriver site corresponding to the browser you'll be using.