*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://automationexercise.com
${EMAIL}          test@example.com

*** Test Cases ***
Verify Subscription In Home Page
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Scroll Down To Footer
    Page Should Contain    Subscription
    Input Text    xpath=//*[@id='susbscribe_email']    ${EMAIL}
    Click Button    xpath=//*[@id='subscribe']
    Page Should Contain    You have been successfully subscribed!
    Close Browser

*** Keywords ***
Scroll Down To Footer
    Execute JavaScript    window.scrollTo(0, document.body.scrollHeight);

# Tudo OK