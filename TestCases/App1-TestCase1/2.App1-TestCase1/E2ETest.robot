*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${EMAIL}    test@example.com

*** Test Cases ***
Verify Subscription in Home Page
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Scroll Down To Footer
    Page Should Contain    Subscription
    Input Email And Subscribe    ${EMAIL}
    Success Message Should Be Visible

*** Keywords ***
Scroll Down To Footer
    Execute JavaScript    window.scrollTo(0, document.body.scrollHeight)

Input Email And Subscribe
    [Arguments]    ${email}
    Input Text    xpath=//*[@id='susbscribe_email']    ${email}
    Click Button    xpath=//*[@id='subscribe']

Success Message Should Be Visible
    Wait Until Element Is Visible    xpath=//*[contains(text(), 'You have been successfully subscribed!')]
    Element Should Be Visible    xpath=//*[@id='success-subscribe']

# Tudo OK