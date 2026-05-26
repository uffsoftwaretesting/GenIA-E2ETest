from google import genai
from google.genai import types
import json
import re


class GeminiProvider:

    def generate_text(
        self,
        api_key,
        model,
        prompt,
        temperature=0.0
    ):

        client = genai.Client(
            api_key=api_key
        )

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=temperature)
        )

        return response.text

    def generate_json(
        self,
        api_key,
        model,
        prompt,
        temperature=0.0
    ):

        text = self.generate_text(
            api_key,
            model,
            prompt,
            temperature=temperature
        )

        # Remove markdown
        text = text.replace(
            "```json",
            ""
        ).replace(
            "```",
            ""
        ).strip()

        # Extrai JSON válido
        match = re.search(
            r'(\{.*\}|\[.*\])',
            text,
            re.DOTALL
        )

        if match:
            text = match.group(1)

        try:
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                text = _escape_invalid_json_backslashes(text)
                return json.loads(text)

        except json.JSONDecodeError as e:
            raise Exception(
                f"Erro ao converter resposta Gemini para JSON:\n{e}\n\nResposta:\n{text}"
            )


def _escape_invalid_json_backslashes(text: str) -> str:
    result = []
    in_string = False
    escaped = False
    valid_escapes = {'"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'}

    for index, char in enumerate(text):
        if escaped:
            result.append(char)
            escaped = False
            continue

        if char == '\\' and in_string:
            next_char = text[index + 1] if index + 1 < len(text) else ''
            if next_char not in valid_escapes:
                result.append('\\\\')
                continue
            escaped = True
            result.append(char)
            continue

        if char == '"' and not escaped:
            in_string = not in_string

        result.append(char)

    return "".join(result)

    def validate_connection(
        self,
        api_key,
        model
    ):

        try:

            client = genai.Client(
                api_key=api_key
            )

            client.models.generate_content(
                model=model,
                contents="Connection test"
            )

            return True

        except Exception as e:
            raise Exception(
                f"Erro ao validar conexão Gemini: {str(e)}"
            )
