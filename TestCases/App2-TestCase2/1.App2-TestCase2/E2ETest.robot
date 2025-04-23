*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${STATE_DROPDOWN_XPATH}    //*[@id='estado']
${STATE_OPTION_XPATH}    //*[@id='estado']/option[@value='AM']
${MOVIE_CARD_XPATH}    //*[@class='_movie_card_1tfx4_343']/div/h4[text()='Joker']

*** Test Cases ***
Test Case 6: Successfully Filter Movies by State
    Open Browser    ${URL}    chrome
    Click Element    ${STATE_DROPDOWN_XPATH}
    Select From List By Value    ${STATE_DROPDOWN_XPATH}    AM
    Element Should Be Visible    ${MOVIE_CARD_XPATH}
    Close Browser

#TUDO OK