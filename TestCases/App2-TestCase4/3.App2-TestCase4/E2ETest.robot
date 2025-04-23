*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${MOVIE_CARD}    //h4[text()='Barbie']
${MOVIE_TITLE}    //p[contains(text(), 'Barbie')]

*** Test Cases ***
Successfully Navigate to Movie Details Page
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Page Should Contain Element    xpath=//*[@class='_home_1tfx4_89']
    Click Element    xpath=${MOVIE_CARD}
    Sleep  2s
    Page Should Contain Element    xpath=${MOVIE_TITLE}
    Close Browser

#TUDO OK