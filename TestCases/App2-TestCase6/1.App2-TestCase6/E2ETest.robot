*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${CREATE_MOVIE_URL}    http://localhost:5173/CreateMovie
${MOVIE_URL_CARTAZ}    http://example.com/poster.jpg
${MOVIE_NAME}    Example Movie
${MOVIE_DESCRIPTION}    This is an example movie description.
${AGE_RATING}    PG-13
${DIRECTOR}    John Doe
${WRITER}    Jane Doe
${ACTOR}    Mike Smith
${GENRE}    Action
${RELEASE_DATE}    2025-04-20

*** Test Cases ***
Test Case 6: Successfully Register a New Movie
    Open Browser    ${URL}    chrome   #troquei launch browser
    Maximize Browser Window
    Go To    ${CREATE_MOVIE_URL}        # Click Button    xpath=//*[@id='createMovieButton']
    Input Text    xpath=//*[@id='url_cartaz']    ${MOVIE_URL_CARTAZ}
    Input Text    xpath=//*[@id='nome']    ${MOVIE_NAME}
    Input Text    xpath=//*[@id='descricao']    ${MOVIE_DESCRIPTION}
    Input Text    xpath=//*[@id='faixa_etaria']    ${AGE_RATING}
    Input Text    xpath=//*[@id='diretor']    ${DIRECTOR}
    Input Text    xpath=//*[@id='escritor']    ${WRITER}
    Input Text    xpath=//*[@id='ator']    ${ACTOR}
    Input Text    xpath=//*[@id='genero']    ${GENRE}        # Select From List By Value    xpath=//*[@id='genero']    ${GENRE}
    Input Text    xpath=//*[@id='data_lancamento']    ${RELEASE_DATE}
    Click Button    xpath=//*[@class='_buttonSubmite_1caxf_291']
    Page Should Contain Element    xpath=//*[contains(text(), 'Film Created Successfully!')]
    Close Browser

#TUDO OK