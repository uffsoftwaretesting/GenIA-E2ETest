*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${URL}    http://localhost:5173/
${CREATE_MOVIE_URL}    http://localhost:5173/CreateMovie

*** Test Cases ***
Test Case 6: Successfully Register a New Movie
    Open Browser    ${URL}   chrome     #troquei launch browser
    Maximize Browser Window
    Go To    ${CREATE_MOVIE_URL}        # Click Element    xpath=//*[@id='createMovieButton']
    Input Text    xpath=//*[@class='_campos_1caxf_127']/input[1]    https://example.com/cartaz
    Input Text    xpath=//*[@class='_campos_1caxf_127']/input[2]    Movie Name
    Input Text    xpath=//*[@class='_campos_1caxf_127']/textarea    This is a movie description.
    Input Text    xpath=//*[@class='_campos_1caxf_127']/input[3]    PG-13
    Input Text    xpath=//*[@class='_campos_1caxf_127']/input[4]    Director Name
    Input Text    xpath=//*[@class='_campos_1caxf_127']/section[1]/input[1]    Writer Name       #modificado 
    Input Text    xpath=//*[@class='_campos_1caxf_127']/section[2]/input[1]    Actor Name    # Input Text    xpath=//*[@class='_addInput_1caxf_237']/input[2]    Actor Name
    Input Text    xpath=//*[@class='_campos_1caxf_127']/section[3]/input[1]    Genre Name        # Input Text    xpath=//*[@class='_addInput_1caxf_237']/input[3]    Genre
    Input Text    xpath=//*[@class='_campos_1caxf_127']/input[5]    2023-04-20
    Click Element    xpath=//*[@class='_buttonSubmite_1caxf_291']
    Page Should Contain       Film Created Successfully!    # Page Should Contain Element    xpath=//*[@id='success_message']