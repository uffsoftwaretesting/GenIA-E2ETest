*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${SUBSCRIBE_EMAIL_FIELD}    xpath=//*[@id='susbscribe_email']
${SUBSCRIBE_BUTTON}    xpath=//*[@id='subscribe']
${SUCCESS_MESSAGE}    xpath=//*[@id='success-subscribe']
${CART_BUTTON}    xpath=//a[contains(text(), 'Cart')]

*** Test Cases ***
Verify Subscription in Cart page
    Open Browser    ${URL}    chrome   #modifiquei launch browser
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Click Element    ${CART_BUTTON}
    # Scroll Down    200
    Scroll Element Into View    ${SUBSCRIBE_EMAIL_FIELD}
    # Should Be Visible    SUBSCRIPTION
    Input Text    ${SUBSCRIBE_EMAIL_FIELD}    test@example.com
    Click Element    ${SUBSCRIBE_BUTTON}
    Element Should Be Visible    ${SUCCESS_MESSAGE}
    [Teardown]    Close Browser

#tudo OK