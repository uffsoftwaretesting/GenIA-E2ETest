*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${CART_BUTTON}    //a[contains(text(), 'Cart')]
${FOOTER}    //footer[@id='footer']
${SUBSCRIPTION_HEADER}    //div[contains(@class, 'single-widget')]/h2[text()='Subscription']
${EMAIL_INPUT}    //input[@id='susbscribe_email']
${SUBSCRIBE_BUTTON}    //button[@id='subscribe']
${SUCCESS_MESSAGE}    //div[@id='success-subscribe']

*** Test Cases ***
Verify Subscription in Cart Page
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Element    ${CART_BUTTON}
    Scroll Element Into View    ${FOOTER}
    Element Should Be Visible    ${SUBSCRIPTION_HEADER}
    Input Text    ${EMAIL_INPUT}    test@example.com
    Click Element    ${SUBSCRIBE_BUTTON}
    Element Should Contain    ${SUCCESS_MESSAGE}    You have been successfully subscribed!
    Close Browser

#TUDO OK