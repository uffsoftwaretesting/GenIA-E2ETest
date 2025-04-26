*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://automationexercise.com
${EMAIL}  test@example.com

*** Test Cases ***
Verify Subscription in Home Page
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Title Should Be    Automation Exercise
    Scroll Down To Footer
    Page Should Contain Element    //h2[contains(text(), "SUBSCRIPTION")]     # modifiquei should be visible por esse  
    Input Text    //input[@id='susbscribe_email']    ${EMAIL}
    Click Button    //button[@id='subscribe']
    Page Should Contain Element    //div[@id='success-subscribe']        # modifiquei should be visible por esse 
    Page Should Contain Element    //div[contains(text(), 'You have been successfully subscribed!')]        # modifiquei should be visible por esse 
    Close Browser

*** Keywords ***
Scroll Down To Footer
    Execute JavaScript    window.scrollTo(0, document.body.scrollHeight);

# Tudo OK
