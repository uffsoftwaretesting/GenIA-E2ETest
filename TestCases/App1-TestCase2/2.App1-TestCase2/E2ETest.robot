*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com

*** Test Cases ***
Verify Scroll Up and Scroll Down functionality
    Open Browser    ${URL}    Chrome        options=add_argument("--user-data-dir=C:/Users/Elvis/AppData/Local/Google/Chrome/test")
    Maximize Browser Window
    Page Should Contain Element    //div[@class='container']
    Page Should Contain Element    //header[@id='header']
    # Scroll Down Page
    Scroll Element Into View    //div[@class='footer-widget']//h2[text()='Subscription']
    # Wait Until Element Is Visible    //div[@class='footer-widget']//h2[text()='Subscription']
    # Scroll Down Page
    Wait Until Element Is Visible    //h2[contains(text(), 'Subscription')]
    Click Element    //a[@id='scrollUp']
    Wait Until Element Is Visible    //h2[contains(text(), 'Full-Fledged practice website for Automation Engineers')]
    Close Browser

# tudo OK, modificações Scroll down page nã existe