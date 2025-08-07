*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${CONTACT_US_BUTTON}    //a[contains(text(), 'Contact us')]
${GET_IN_TOUCH_HEADER}    //h2[contains(text(), 'Get In Touch')]
${NAME_FIELD}    //*[@id='contact-us-form']//input[@name='name']
${EMAIL_FIELD}    //*[@id='contact-us-form']//input[@name='email']
${SUBJECT_FIELD}    //*[@id='contact-us-form']//input[@name='subject']
${MESSAGE_FIELD}    //*[@id='contact-us-form']//textarea[@name='message']
${UPLOAD_FILE_FIELD}    //*[@id='contact-us-form']//input[@name='upload_file']
${SUBMIT_BUTTON}    //*[@id='contact-us-form']//input[@name='submit']
${OK_BUTTON}    //button[contains(text(), 'OK')]
${SUCCESS_MESSAGE}    //div[contains(text(), 'Success! Your details have been submitted successfully.')]
${HOME_BUTTON}    //a[contains(@href, '/') and contains(text(), 'Home')]

*** Test Cases ***
Test Case 6: Contact Us Form
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Element    ${CONTACT_US_BUTTON}
    Element Should Be Visible    ${GET_IN_TOUCH_HEADER}
    Input Text    ${NAME_FIELD}    John Doe
    Input Text    ${EMAIL_FIELD}    john.doe@example.com
    Input Text    ${SUBJECT_FIELD}    Test Subject
    Input Text    ${MESSAGE_FIELD}    This is a test message.
    # Uncomment the following line to test file upload (ensure the file path is correct)
    Choose File    ${UPLOAD_FILE_FIELD}    C:\\Users\\Elvis\\OneDrive\\Imagens\\133714229538608439.jpg
    Click Element    ${SUBMIT_BUTTON}
    Handle Alert    action=ACCEPT   #adicionado
    # Click Element    ${OK_BUTTON}
    Element Should Be Visible    ${SUCCESS_MESSAGE}
    Click Element    ${HOME_BUTTON}
    [Teardown]    Close Browser

#Tudo OK