from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional

from backend import models
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="cartoon-themed API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RestauranteCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    categoria: Optional[str] = Field(None, max_length=50)
    descricao: Optional[str] = Field(None, max_length=500)
    endereco: Optional[str] = Field(None, max_length=200)
    telefone: Optional[str] = Field(None, max_length=20)


class RestauranteUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    categoria: Optional[str] = Field(None, max_length=50)
    descricao: Optional[str] = Field(None, max_length=500)
    endereco: Optional[str] = Field(None, max_length=200)
    telefone: Optional[str] = Field(None, max_length=20)


class ComidaCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    preco: float = Field(..., gt=0)


class ComidaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    preco: Optional[float] = Field(None, gt=0)


@app.get("/restaurantes")
def listar_restaurantes(
    nome: Optional[str] = Query(None, min_length=1),
    db: Session = Depends(get_db)
):
    query = db.query(models.Restaurante).options(joinedload(models.Restaurante.cardapio))

    if nome:
        termo = f"%{nome}%"
        query = query.filter(
            or_(
                models.Restaurante.nome.ilike(termo),
                models.Restaurante.categoria.ilike(termo)
            )
        )

    return query.all()


@app.get("/restaurantes/{id}")
def obter_restaurante(id: int, db: Session = Depends(get_db)):
    restaurante = (
        db.query(models.Restaurante)
        .options(joinedload(models.Restaurante.cardapio))
        .filter(models.Restaurante.id == id)
        .first()
    )
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante


@app.post("/restaurantes", status_code=201)
def criar_restaurante(dados: RestauranteCreate, db: Session = Depends(get_db)):
    novo = models.Restaurante(
        nome=dados.nome.strip(),
        categoria=dados.categoria.strip() if dados.categoria else None,
        descricao=dados.descricao.strip() if dados.descricao else None,
        endereco=dados.endereco.strip() if dados.endereco else None,
        telefone=dados.telefone.strip() if dados.telefone else None
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@app.patch("/restaurantes/{id}")
def editar_restaurante(id: int, dados: RestauranteUpdate, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    if dados.nome is not None:
        restaurante.nome = dados.nome.strip()
    if dados.categoria is not None:
        restaurante.categoria = dados.categoria.strip() or None
    if dados.descricao is not None:
        restaurante.descricao = dados.descricao.strip() or None
    if dados.endereco is not None:
        restaurante.endereco = dados.endereco.strip() or None
    if dados.telefone is not None:
        restaurante.telefone = dados.telefone.strip() or None

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
def adicionar_comida(id: int, dados: ComidaCreate, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")

    nova = models.Comida(
        nome=dados.nome.strip(),
        preco=dados.preco,
        restaurante_id=id
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova


@app.get("/restaurantes/{id}/cardapio")
def listar_cardapio(id: int, db: Session = Depends(get_db)):
    restaurante = db.query(models.Restaurante).filter(models.Restaurante.id == id).first()
    if not restaurante:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante.cardapio


@app.patch("/restaurantes/{id}/cardapio/{comida_id}")
def editar_comida(id: int, comida_id: int, dados: ComidaUpdate, db: Session = Depends(get_db)):
    comida = db.query(models.Comida).filter(
        models.Comida.id == comida_id,
        models.Comida.restaurante_id == id
    ).first()
    if not comida:
        raise HTTPException(status_code=404, detail="Comida não encontrada")

    if dados.nome is not None:
        comida.nome = dados.nome.strip()
    if dados.preco is not None:
        comida.preco = dados.preco

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