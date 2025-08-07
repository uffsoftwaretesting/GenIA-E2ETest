*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://automationexercise.com
${SIGNUP_URL}    https://automationexercise.com/login
${BROWSER}        Chrome
${NAME}          Test User
${EMAIL}         testusere2e1@example.com
${PASSWORD}      Test@123
${DOB}           01/01/1990
${FIRST_NAME}    Test
${LAST_NAME}     User
${COMPANY}       Test Company
${ADDRESS}       123 Test St
${ADDRESS2}      Apt 4
${COUNTRY}       United States
${STATE}         California
${CITY}          Los Angeles
${ZIPCODE}       90001
${MOBILE}        1234567890

*** Test Cases ***
Register User
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Link    xpath=//*[@class='nav navbar-nav']/li/a[contains(text(), 'Home')]
    Click Link    xpath=//*[@class='nav navbar-nav']/li/a[contains(text(), 'Signup / Login')]
    Page Should Contain Element    xpath=//*[@id='form']//h2[text()='New User Signup!']
    Input Text    xpath=//*[@id='form']//input[@data-qa='signup-name']    ${NAME}
    Input Text    xpath=//*[@id='form']//input[@data-qa='signup-email']    ${EMAIL}
    Click Button    xpath=//*[@id='form']//button[@data-qa='signup-button']
    Sleep     2s
    # Input Text    xpath=//*[@id='form']//input[@name='title']    Mr.
    # Input Text    xpath=//*[@id='form']//input[@name='name']    ${NAME}
    # Input Text    xpath=//*[@id='form']//input[@data-qa='email']    ${EMAIL}
    # Input Text    xpath=//*[@id='form']//input[@name='password']    ${PASSWORD}
    # Input Text    xpath=//*[@id='form']//input[@name='dob']    ${DOB}
    # Check Checkbox        xpath=//*[@id='form']//input[@name='newsletter']
    # Check Checkbox        xpath=//*[@id='form']//input[@name='offers']
    # Input Text    xpath=//*[@id='form']//input[@name='first_name']    ${FIRST_NAME}
    # Input Text    xpath=//*[@id='form']//input[@name='last_name']    ${LAST_NAME}
    # Input Text    xpath=//*[@id='form']//input[@name='company']    ${COMPANY}
    # Input Text    xpath=//*[@id='form']//input[@name='address']    ${ADDRESS}
    # Input Text    xpath=//*[@id='form']//input[@name='address2']    ${ADDRESS2}
    # Select From List By Value    xpath=//*[@id='form']//select[@name='country']    ${COUNTRY}
    # Input Text    xpath=//*[@id='form']//input[@name='state']    ${STATE}
    # Input Text    xpath=//*[@id='form']//input[@name='city']    ${CITY}
    # Input Text    xpath=//*[@id='form']//input[@name='zipcode']    ${ZIPCODE}
    # Input Text    xpath=//*[@id='form']//input[@name='mobile']    ${MOBILE}
    # Click Button    xpath=//*[@id='form']//button[@name='create_account']
    # Page Should Contain Element    xpath=//h2[text()='Login to your account']
    # Page Should Contain Element    xpath=//*[@id='form']/h2[text()='ACCOUNT CREATED!']
    # Click Button    xpath=//button[text()='Continue']
    # Page Should Contain Element    xpath=//*[@id='header']/div[1]/div[2]/div[1]/span
    # Click Button    xpath=//*[@id='account']/div[1]/div[2]/div[2]/a[2]
    # Page Should Contain Element    xpath=//*[@id='form']/h2[text()='ACCOUNT DELETED!']
    # Click Button    xpath=//*[@id='form']/div/a
    Close Browser