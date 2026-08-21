from fastapi import FastAPI

app = FastAPI()

restaurantes = [
    {"id": 1, "name": "Krusty Burger"},
    {"id": 2, "name": "Planet Pizza"},
    {"id": 3, "name": "Siri Cascudo"},
    {"id": 4, "name": "Bistrot Chez Rémy"}
]

@app.get("/restaurantes")
def listar_restaurantes():
    return restaurantes

@app.get("/restaurantes/{id}")
def listar_restaurantes(id: int):
    for restaurante in restaurantes:
        if restaurante["id"] == id:
            return restaurante
        
    return {"mensagem":"Restaurante não encontrado"}
@app.post("/restaurantes")
def criar_restaurante(nome: str):
    if len(restaurantes) > 0:
        novo_id = max(r["id"] for r in restaurantes) + 1
    else: 
        novo_id = 1
    novo_restaurante = {
        "id": novo_id,
        "nome": nome
    }
    restaurantes.append(novo_restaurante)
    return novo_restaurante
