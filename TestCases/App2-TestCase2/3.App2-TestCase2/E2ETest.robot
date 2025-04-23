*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}     http://localhost:5173/
${STATE}   AM
${MOVIE}   Joker

*** Test Cases ***
Test Case 6: Successfully Filter Movies by State
    [Documentation]    Verify filtering movies by state works as intended.
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Click Element    xpath=//*[@id='estado']
    Select From List By Value    xpath=//*[@id='estado']    ${STATE}
    Click Element    xpath=//option[@value='${STATE}']
    ${movie_visible}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//h4[text()='${MOVIE}']
    [Teardown]    Close Browser  

#TUDO OK