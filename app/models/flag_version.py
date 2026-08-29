from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class FlagVersion(Base):
    __tablename__ = "flag_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    flag_id: Mapped[int] = mapped_column(
        ForeignKey("flags.id"),
        nullable=False,
        index=True
    )
    version: Mapped[int] = mapped_column(nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    enabled: Mapped[bool] = mapped_column(nullable=False, default=False)

    flag = relationship("Flag", back_populates="versions")
