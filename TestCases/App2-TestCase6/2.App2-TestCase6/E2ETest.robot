*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173/
${CREATE_MOVIE_URL}    ${BASE_URL}CreateMovie
${SUCCESS_MESSAGE}    Film Created Successfully!

*** Test Cases ***
Test Case 6: Successfully Register a New Movie
    [Documentation]    Test to successfully register a new movie.
    Open Browser    ${BASE_URL}    Chrome
    Maximize Browser Window
    Go To    ${CREATE_MOVIE_URL}    # Click Element    xpath=//*[@id='createMovieButton']
    Wait Until Page Contains Element    xpath=//*[@id='url_cartaz']
    Input Text    xpath=//*[@id='url_cartaz']    https://example.com/movie_poster
    Input Text    xpath=//*[@id='nome']    Example Movie
    Input Text    xpath=//*[@id='descricao']    This is an example movie description.
    Input Text    xpath=//*[@id='faixa_etaria']    PG-13
    Input Text    xpath=//*[@id='diretor']    John Doe
    Input Text    xpath=//*[@id='escritor']    Jane Doe
    Input Text    xpath=//*[@id='ator']    Actor Name
    Input Text    xpath=//*[@id='genero']    Action    # Select From List By Value    xpath=//*[@id='genero']    Action
    Input Text    xpath=//*[@id='data_lancamento']    2025-01-01
    Click Button    xpath=//*[@class='_buttonSubmite_1caxf_291']    # Click Element    xpath=//*[@id='criar_button']
    Wait Until Page Contains    ${SUCCESS_MESSAGE}
    Close Browser

#TUDO OK