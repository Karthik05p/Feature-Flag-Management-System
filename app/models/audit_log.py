from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    environment_id: Mapped[int | None] = mapped_column(
        ForeignKey("environments.id"),
        index=True
    )
    flag_id: Mapped[int | None] = mapped_column(
        ForeignKey("flags.id"),
        index=True
    )
    previous_state: Mapped[str | None] = mapped_column(Text)
    new_state: Mapped[str | None] = mapped_column(Text)
