import anthropic
import json
import re

def parse_json_output(text):

    if not text or not text.strip():
        raise Exception("Anthropic returned an empty response")

    text = text.strip()
    text = text.replace("```json", "").replace("```", "").strip()

    match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
    if match:
        text = match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        text = _escape_invalid_json_backslashes(text)
        return json.loads(text)


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

class AnthropicProvider:

    def generate_text(
        self,
        api_key,
        model,
        prompt,
        temperature=0.0
    ):

        client = anthropic.Anthropic(
            api_key=api_key
        )

        response = client.messages.create(
            model=model,
            max_tokens=4000,
            temperature=temperature,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.content[0].text

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

        try:
            return parse_json_output(text)
        except json.JSONDecodeError as e:
            raise Exception(
                f"Erro ao converter resposta Anthropic para JSON:\n{e}\n\nResposta:\n{text}"
            )

    def validate_connection(
        self,
        api_key,
        model
    ):

        anthropic.Anthropic(
            api_key=api_key
        )
