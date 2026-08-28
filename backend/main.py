from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from backend import models

from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)  # cria as tabelas se não existirem

app = FastAPI(title="cartoon-themed API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/restaurantes")
def listar_restaurantes(db: Session = Depends(get_db)):
    return db.query(models.Restaurante).all()


@app.get("/restaurantes/{id}")
def obter_restaurante(id: int, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante


@app.post("/restaurantes", status_code=201)
def criar_restaurante(nome: str, db: Session = Depends(get_db)):
    nome = nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome do restaurante é obrigatório")

    novo_restaurante = models.Restaurante(nome=nome)
    db.add(novo_restaurante)
    db.commit()
    db.refresh(novo_restaurante)
    return novo_restaurante


@app.patch("/restaurantes/{id}")
def editar_restaurante(id: int, nome: str, db: Session = Depends(get_db)):
    nome = nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome do restaurante é obrigatório")

    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    restaurante.nome = nome
    db.commit()
    db.refresh(restaurante)
    return restaurante


@app.delete("/restaurantes/{id}")
def deletar_restaurante(id: int, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    db.delete(restaurante)
    db.commit()
    return {"mensagem": "Restaurante removido com sucesso", "restaurante_id": id}


@app.post("/restaurantes/{id}/cardapio", status_code=201)
def adicionar_comida(id: int, nome: str, preco: float, db: Session = Depends(get_db)):
    nome = nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Nome da comida é obrigatório")
    if preco <= 0:
        raise HTTPException(status_code=400, detail="Preço deve ser maior que zero")

    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    nova_comida = models.Comida(nome=nome, preco=preco, restaurante_id=id)
    db.add(nova_comida)
    db.commit()
    db.refresh(nova_comida)
    return nova_comida


@app.get("/restaurantes/{id}/cardapio")
def listar_cardapio(id: int, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante.cardapio


@app.patch("/restaurantes/{id}/cardapio/{comida_id}")
def editar_comida(id: int, comida_id: int, nome: str = None, preco: float = None, db: Session = Depends(get_db)):
    comida = db.query(models.Comida).filter(
        models.Comida.id == comida_id,
        models.Comida.restaurante_id == id
    ).first()
    if not comida:
        raise HTTPException(status_code=404, detail="Comida não encontrada")

    if nome is not None:
        nome = nome.strip()
        if not nome:
            raise HTTPException(status_code=400, detail="Nome da comida é obrigatório")
        comida.nome = nome
    if preco is not None:
        if preco <= 0:
            raise HTTPException(status_code=400, detail="Preço deve ser maior que zero")
        comida.preco = preco

    db.commit()
    db.refresh(comida)
    return comida


@app.delete("/restaurantes/{id}/cardapio/{comida_id}")
def deletar_comida(id: int, comida_id: int, db: Session = Depends(get_db)):
    comida = db.query(models.Comida).filter(
        models.Comida.id == comida_id,
        models.Comida.restaurante_id == id
    ).first()
    if not comida:
        raise HTTPException(status_code=404, detail="Comida não encontrada")

    db.delete(comida)
    db.commit()
    return {"mensagem": "Comida removida com sucesso", "comida_id": comida_id}


FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def ler_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")