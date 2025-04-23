*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${MOVIE_NAME}    Interstellar
${SEARCH_INPUT}    xpath=//*[@id='titulo']         #troquei
${MOVIE_CARD}    xpath=//*[contains(text(), 'Interstellar')]//ancestor::button

*** Test Cases ***
Successfully Search for a Movie
    Open Browser    ${URL}    Chrome
    Maximize Browser Window
    Element Should Be Visible    xpath=${SEARCH_INPUT}
    Input Text    ${SEARCH_INPUT}    ${MOVIE_NAME}
    Sleep    2s
    Element Should Be Visible    ${MOVIE_CARD}
    Close Browser