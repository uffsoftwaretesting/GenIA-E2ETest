*** Settings ***
Library           SeleniumLibrary

*** Variables ***
${URL}            http://localhost:5173/
${MOVIE_NAME}     Interstellar
${SEARCH_INPUT}   xpath=//*[@id='titulo']            #mudei
${MOVIE_CARD}     xpath=//*[@class='_movie_card_1tfx4_343']//h4[contains(text(), '${MOVIE_NAME}')]

*** Test Cases ***
Successfully Search for a Movie
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Input Text    ${SEARCH_INPUT}    ${MOVIE_NAME}
    Click Button    ${SEARCH_INPUT}
    Wait Until Element Is Visible    ${MOVIE_CARD}
    Element Should Be Visible    ${MOVIE_CARD}
    Close Browser

#TUDO OK
