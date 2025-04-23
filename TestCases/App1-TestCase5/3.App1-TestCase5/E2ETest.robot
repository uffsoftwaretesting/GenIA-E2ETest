*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${SIGNUP_URL}    https://automationexercise.com/login
${USERNAME}    TestUser
${EMAIL}    testuser@example.com
${PASSWORD}    TestPassword123
${FIRSTNAME}    Test
${LASTNAME}    User
${COMPANY}    TestCompany
${ADDRESS}    123 Test St
${ADDRESS2}    Apt 1
${COUNTRY}    United States
${STATE}    California
${CITY}    Los Angeles
${ZIPCODE}    90001
${MOBILENUMBER}    1234567890

*** Test Cases ***
Register User
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Go To    ${URL}
    Title Should Be    Automation Exercise
    Click Element    //a[contains(text(), 'Signup / Login')]
    # Element Should Be Visible    //*[@id='form']/div[2]/div[1]/h2
    # Input Text    //*[@id='form']/div[2]/div[2]/form/input[1]    ${USERNAME}
    # Input Text    //*[@id='form']/div[2]/div[2]/form/input[2]    ${EMAIL}
    # Click Element    //*[@id='form']/div[2]/div[2]/form/button
    # Element Should Be Visible    //*[@id='form']/div[3]/div[1]/h2
    # Select From List By Index    //*[@id='form']/div[3]/div[2]/form/select[1]    1
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[1]    ${FIRSTNAME}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[2]    ${EMAIL}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[3]    ${PASSWORD}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[4]    01/01/1990
    # Check Element    //*[@id='form']/div[3]/div[2]/form/input[5]
    # Check Element    //*[@id='form']/div[3]/div[2]/form/input[6]
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[7]    ${FIRSTNAME}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[8]    ${LASTNAME}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[9]    ${COMPANY}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[10]    ${ADDRESS}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[11]    ${ADDRESS2}
    # Select From List By Index    //*[@id='form']/div[3]/div[2]/form/select[2]    1
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[12]    ${STATE}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[13]    ${CITY}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[14]    ${ZIPCODE}
    # Input Text    //*[@id='form']/div[3]/div[2]/form/input[15]    ${MOBILENUMBER}
    # Click Element    //*[@id='form']/div[3]/div[2]/form/button
    # Element Should Be Visible    //h2[text()='Login to your account']
    # Click Element    //button[@data-qa='login-button']
    # Element Should Be Visible    //h2[text()='Logged in as']
    # Click Element    //*[@id='delete-account']
    # Element Should Be Visible    //*[contains(text(), 'ACCOUNT DELETED!')]
    # Click Element    //*[@id='continue']
    Close Browser