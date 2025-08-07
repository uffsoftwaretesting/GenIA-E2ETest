*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://automationexercise.com
${EMAIL}          test@example.com

*** Test Cases ***
Verify Scroll Up and Scroll Down Functionality
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Page Should Contain Element  //div[@class='col-sm-9 padding-right']
    Page Should Contain Element  //h2[contains(text(), 'Full-Fledged practice website for Automation Engineers')]
    Page Should Contain Element  //header[@id='header']
    Page Should Contain Element  //div[@class='features_items']
    Scroll Down Page
    Page Should Contain Element  //h2[contains(text(), 'Subscription')]
    Input Text  //input[@id='susbscribe_email']  ${EMAIL}
    Click Button  //button[@id='subscribe']
    Click Element  //a[@class='scroll-up']   #errado
    Page Should Contain Element  //h2[contains(text(), 'Full-Fledged practice website for Automation Engineers')]
    Close Browser

*** Keywords ***
Scroll Down Page
    Execute Javascript  window.scrollTo(0, document.body.scrollHeight)