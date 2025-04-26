*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${CART_BUTTON_XPATH}    //a[contains(text(), 'Cart')]
${SUBSCRIPTION_HEADER_XPATH}    //h2[text()='Subscription']
${EMAIL_INPUT_XPATH}    //*[@id='susbscribe_email']
${SUBSCRIBE_BUTTON_XPATH}    //*[@id='subscribe']
${SUCCESS_MESSAGE_XPATH}   //*[@id='success-subscribe']

*** Test Cases ***
Verify Subscription in Cart page
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Page Should Contain Element    ${CART_BUTTON_XPATH}
    Click Element    ${CART_BUTTON_XPATH}
    # Scroll Down To Element    footer#footer
    Scroll Element Into View     ${SUBSCRIPTION_HEADER_XPATH} 
    Page Should Contain Element    ${SUBSCRIPTION_HEADER_XPATH}
    Input Text    ${EMAIL_INPUT_XPATH}    test@example.com
    Click Element    ${SUBSCRIBE_BUTTON_XPATH}
    Page Should Contain Element    ${SUCCESS_MESSAGE_XPATH}
    Close Browser

#TUDO OK