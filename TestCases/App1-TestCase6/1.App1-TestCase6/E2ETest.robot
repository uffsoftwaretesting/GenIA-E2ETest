*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${CONTACT_US_URL}    https://automationexercise.com/contact_us
${NAME}    Test User
${EMAIL}    testuser@example.com
${SUBJECT}    Test Subject
${MESSAGE}    This is a test message.
${FILE_PATH}    C:\\Users\\Elvis\\OneDrive\\Imagens\\133714229538608439.jpg

*** Test Cases ***
Test Case 6: Contact Us Form
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Link    xpath=//a[@href='/' and contains(text(), 'Home')]
    Page Should Contain    Home
    # Click Element    xpath=//*[@id='contact-us-button']
    Click Element    xpath=//*[@id="header"]/div/div/div/div[2]/div/ul/li[8]/a
    Location Should Be    ${CONTACT_US_URL}
    Page Should Contain    Get In Touch
    Input Text    xpath=//*[@id='contact-us-form']//input[@name='name']    ${NAME}
    Input Text    xpath=//*[@id='contact-us-form']//input[@name='email']    ${EMAIL}
    Input Text    xpath=//*[@id='contact-us-form']//input[@name='subject']    ${SUBJECT}
    Input Text    xpath=//*[@id='contact-us-form']//textarea[@name='message']    ${MESSAGE}
    Choose File    xpath=//*[@id='contact-us-form']//input[@name='upload_file']    ${FILE_PATH}
    Click Element    xpath=//*[@id='contact-us-form']//input[@name='submit']
    Handle Alert    action=ACCEPT
    # Click Button    xpath="//button[contains(text(), 'OK')]"
    Page Should Contain    Success! Your details have been submitted successfully.
    Click Link    xpath=//a[contains(@href, '/') and contains(text(), 'Home')]
    Title Should Be    Automation Exercise
    Close Browser

#Tudo OK