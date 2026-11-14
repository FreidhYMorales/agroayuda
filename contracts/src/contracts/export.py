"""Write contracts/schema/contracts.schema.json from the models.

Run: uv run --package contracts python -m contracts.export
Then: npm --prefix web run contracts (regenerates web/src/contracts/contracts.ts)
"""

import json
from pathlib import Path
from typing import Any, Final

from pydantic.json_schema import models_json_schema

from contracts import EXAMPLE_MODELS

SCHEMA_PATH: Final = Path(__file__).resolve().parents[2] / "schema" / "contracts.schema.json"


def _drop_property_titles(node: Any) -> Any:
    """Field titles make json2ts emit one alias per field (Income2, Risk2); model titles stay."""
    if isinstance(node, dict):
        cleaned = {key: _drop_property_titles(value) for key, value in node.items()}
        if isinstance(cleaned.get("properties"), dict):
            for prop in cleaned["properties"].values():
                if isinstance(prop, dict):
                    prop.pop("title", None)
        return cleaned
    if isinstance(node, list):
        return [_drop_property_titles(item) for item in node]
    return node


def build_schema() -> str:
    """One schema with every exported model under $defs, in serialization mode (the wire shape)."""
    _, schema = models_json_schema(
        [(model, "serialization") for model in EXAMPLE_MODELS.values()],
        title="AgroAyudaContracts",
    )
    return (
        json.dumps(_drop_property_titles(schema), indent=2, ensure_ascii=False, sort_keys=True)
        + "\n"
    )


def main() -> None:
    SCHEMA_PATH.write_text(build_schema(), encoding="utf-8", newline="\n")
    print(f"Wrote {SCHEMA_PATH}")


if __name__ == "__main__":
    main()
