*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${EMAIL}    test124@example.com
${NAME}    Test User
${PASSWORD}    password123
${DOB}    01/01/1990
${FIRST_NAME}    Test
${LAST_NAME}    User
${COMPANY}    Test Company
${ADDRESS}    123 Test St
${ADDRESS2}    Apt 4
${COUNTRY}    United States
${STATE}    Test State
${CITY}    Test City
${ZIPCODE}    12345
${MOBILE_NUMBER}    1234567890

*** Test Cases ***
Register User
    [Documentation]    End-to-end test for user registration
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Element    //a[contains(text(), 'Signup / Login')]
    Wait Until Element Is Visible    //*[@class='signup-form']/h2
    Input Text    //*[@class='signup-form']/form/input[@data-qa='signup-name']    ${NAME}
    Input Text    //*[@class='signup-form']/form/input[@data-qa='signup-email']    ${EMAIL}
    Click Element    //*[@class='signup-form']/form/button[@data-qa='signup-button']


    # Wait Until Element Is Visible    //*[text()='ENTER ACCOUNT INFORMATION']
    # Should Be True    Element Is Visible    //*[text()='ENTER ACCOUNT INFORMATION']
    # Input Text    //*[@id='form']/input[@name='title']    Mr.
    # Input Text    //*[@id='form']/input[@name='name']    ${NAME}
    # Input Text    //*[@id='form']/input[@name='email']    ${EMAIL}
    # Input Text    //*[@id='form']/input[@name='password']    ${PASSWORD}
    # Input Text    //*[@id='form']/input[@name='dob']    ${DOB}
    # Click Element    //*[@id='form']/input[@name='newsletter']
    # Click Element    //*[@id='form']/input[@name='special_offers']
    # Input Text    //*[@id='form']/input[@name='first_name']    ${FIRST_NAME}
    # Input Text    //*[@id='form']/input[@name='last_name']    ${LAST_NAME}
    # Input Text    //*[@id='form']/input[@name='company']    ${COMPANY}
    # Input Text    //*[@id='form']/input[@name='address']    ${ADDRESS}
    # Input Text    //*[@id='form']/input[@name='address2']    ${ADDRESS2}
    # Select From List By Value    //*[@id='form']/select[@name='country']    United States
    # Input Text    //*[@id='form']/input[@name='state']    ${STATE}
    # Input Text    //*[@id='form']/input[@name='city']    ${CITY}
    # Input Text    //*[@id='form']/input[@name='zipcode']    ${ZIPCODE}
    # Input Text    //*[@id='form']/input[@name='mobile_number']    ${MOBILE_NUMBER}
    # Click Element    //*[@id='form']/button[@name='create_account']
    # Wait Until Element Is Visible    //h2[text()='Login to your account']
    # Should Be True    Element Is Visible    //h2[text()='Login to your account']
    # Click Element    //button[@data-qa='login-button']
    # Wait Until Element Is Visible    //*[@id='header']/div[2]/div/ul/li[10]/a
    # Should Be True    Element Is Visible    //*[@id='header']/div[2]/div/ul/li[10]/a
    # Click Element    //*[@id='account']/div[2]/div/a[2]
    # Wait Until Element Is Visible    //*[@id='content']/div/h2
    # Should Be True    Element Is Visible    //*[@id='content']/div/h2
    # Click Element    //button[@data-qa='continue']
    Close Browser