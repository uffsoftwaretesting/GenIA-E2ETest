*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://automationexercise.com
${SCROLL_DOWN}   //h2[contains(text(), 'Subscription')]
${SCROLL_UP}     //a[@id='scrollUp']
${HEADER}        //header[@id='header']
${SLIDER}        //section[@id='slider']
${CONTENT}       //div[@class='col-sm-9 padding-right']
${H2_TEXT}       //h2[contains(text(), 'Full-Fledged practice website for Automation Engineers')]
${FEATURES}      //*[@class='features_items']
${RECOMMENDED}   //div[@class='recommended_items']

*** Test Cases ***
Verify Scroll Up and Scroll Down Functionality
    Open Browser    ${URL}    chrome  #   modifiquei launch browser por esse 
    Maximize Browser Window
    Verify Home Page Is Visible
    Scroll Down Page To Bottom
    Verify Subscription Is Visible
    Click On Arrow At Bottom Right Side To Move Upward
    Verify Page Is Scrolled Up

*** Keywords ***
Verify Home Page Is Visible
    Element Should Be Visible    ${HEADER}         # modifiquei should be visible por esse
    Element Should Be Visible    ${SLIDER}         # modifiquei should be visible por esse
    Element Should Be Visible    ${CONTENT}        # modifiquei should be visible por esse
    Element Should Be Visible    ${H2_TEXT}        # modifiquei should be visible por esse
    Element Should Be Visible    ${FEATURES}        # modifiquei should be visible por esse
    Element Should Be Visible    ${RECOMMENDED}        # modifiquei should be visible por esse

Scroll Down Page To Bottom        
    Element Should Be Visible    ${SCROLL_DOWN}        # modifiquei should be visible por esse

Verify Subscription Is Visible
    Element Should Be Visible    ${SCROLL_DOWN}        # modifiquei should be visible por esse

Click On Arrow At Bottom Right Side To Move Upward
    Click Element    ${SCROLL_UP}        # elemento identificado corretamento porém fica se movendo na página web, dificultando o click do selenium

Verify Page Is Scrolled Up
    Element Should Be Visible    ${H2_TEXT}            # modifiquei should be visible por esse

# tudo ok