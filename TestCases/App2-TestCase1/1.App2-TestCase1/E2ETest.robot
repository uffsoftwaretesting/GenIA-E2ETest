*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://localhost:5173/
${MOVIE_NAME}     Interstellar
${SEARCH_INPUT}   //*[@id='titulo']       #mudei
${MOVIE_CARD}     //button[contains(., 'Interstellar')]

*** Test Cases ***
Successfully Search for a Movie
    [Documentation]    Successfully search for a movie by entering the movie name and verifying its visibility.
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Input Text    ${SEARCH_INPUT}    ${MOVIE_NAME}
    Click Button    ${SEARCH_INPUT}/following-sibling::button
    Wait Until Element Is Visible    ${MOVIE_CARD}
    Element Should Be Visible    ${MOVIE_CARD}
    Close Browser

#TUDO OK