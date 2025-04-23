*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${HOME_URL}    http://localhost:5173/
${MOVIE_CARD_XPATH}    //button[div/h4[text()='Barbie']]
${MOVIE_DETAILS_XPATH}    //*[contains(., 'Barbie')]
${MOVIE_TITLE_XPATH}    //*[@class='_movie_card_list_top_6y9nh_183']/h4[contains(text(), 'Barbie')]
${MOVIE_DESCRIPTION_XPATH}    //*[@class='_movie_card_list_bottom_6y9nh_215']/p[contains(text(), 'Barbie')]
${MOVIE_POSTER_XPATH}    //*[@class='_section_movie_informations_eeems_393']/img

*** Test Cases ***
Successfully Navigate to Movie Details Page
    Open Browser    ${HOME_URL}    chrome
    Maximize Browser Window
    Page Should Contain Element    ${MOVIE_CARD_XPATH}
    Click Element    ${MOVIE_CARD_XPATH}
    Page Should Contain Element    ${MOVIE_DETAILS_XPATH}
    [Teardown]    Close Browser

#TUDO OK