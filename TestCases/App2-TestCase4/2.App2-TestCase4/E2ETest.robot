*** Settings ***
Library    SeleniumLibrary

*** Test Cases ***
Successfully Navigate to Movie Details Page
    Open Browser    http://localhost:5173/    chrome
    Maximize Browser Window
    Page Should Contain Element    xpath=//*[@class='_home_1tfx4_89']
    Click Element    xpath=//*[@class='_movie_card_1tfx4_343'][1]
    Page Should Contain    Barbie
    Close Browser

#TUDO OK