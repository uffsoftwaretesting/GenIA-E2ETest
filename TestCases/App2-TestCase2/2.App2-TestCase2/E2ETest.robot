*** Settings ***
Library  SeleniumLibrary

*** Variables ***
${URL}  http://localhost:5173/
${STATE_DROPDOWN_XPATH}  //*[@id='estado']
${STATE_OPTION_XPATH}  //*[@id='estado']/option[text()='AM']
${MOVIE_CARD_XPATH}  //*[contains(@class, '_movie_card_1tfx4_343') and contains(., 'Joker')]

*** Test Cases ***
Test Case 6: Successfully Filter Movies by State
    Open Browser  ${URL}  chrome
    Maximize Browser Window
    Page Should Contain Element  ${STATE_DROPDOWN_XPATH}
    Click Element  ${STATE_DROPDOWN_XPATH}
    Select From List By Value   xpath=${STATE_DROPDOWN_XPATH}  AM     # Select From List By Xpath  ${STATE_DROPDOWN_XPATH}  AM
    Click Element  ${STATE_OPTION_XPATH}
    Wait Until Element Is Visible  ${MOVIE_CARD_XPATH}
    Element Should Be Visible  ${MOVIE_CARD_XPATH}
    Close Browser

#TUDO OK