import { Category } from "../api";
import { useTranslation } from "react-i18next";

type BoardCardProps = {
  categories: Category[];
  isDraft: boolean;
  isBusy: boolean;
  onEditCategory: (
    categoryId: string,
    payload: { name: string; displayOrder: number },
  ) => void;
  onDeleteCategory: (categoryId: string) => void;
  onStartEditClue: (payload: {
    categoryId: string;
    categoryName: string;
    categoryOrder: number;
    clueId: string;
    prompt: string;
    answer: string;
    pointValue: number;
    imageMimeType: string | null;
    imageBase64: string | null;
  }) => void;
  onDeleteClue: (clueId: string) => void;
  onToggleReveal: (clueId: string, currentValue: boolean) => void;
  onToggleAnswered: (clueId: string, currentValue: boolean) => void;
};

export default function BoardCard(props: BoardCardProps) {
  const { t } = useTranslation();
  const {
    categories,
    isDraft,
    isBusy,
    onEditCategory,
    onDeleteCategory,
    onStartEditClue,
    onDeleteClue,
    onToggleReveal,
    onToggleAnswered,
  } = props;

  return (
    <section className="card card-board">
      <h2>{t("components.boardCard.title")}</h2>
      <p className="muted">{t("components.boardCard.subtitle")}</p>
      {!isDraft && (
        <p className="tiny section-lock-note">
          {t("components.boardCard.draftOnlyNote")}
        </p>
      )}
      {categories.length === 0 ? (
        <p className="muted">{t("components.boardCard.noCategories")}</p>
      ) : (
        categories.map((category) => (
          <details key={category.id} className="category accordion-category">
            <summary className="category-summary">
              <span className="category-summary-title">
                {category.displayOrder}. {category.name}
              </span>
              <span className="tiny muted">
                {t("components.boardCard.questionsCount", {
                  count: category.clues.length,
                })}
              </span>
            </summary>
            {isDraft && (
              <div className="row" style={{ marginTop: "0.6rem" }}>
                <button
                  className="btn-secondary"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const nextName = window.prompt(
                      t("components.boardCard.promptCategoryName"),
                      category.name,
                    );
                    if (nextName === null) {
                      return;
                    }

                    const nextOrderRaw = window.prompt(
                      t("components.boardCard.promptCategoryOrder"),
                      String(category.displayOrder),
                    );
                    if (nextOrderRaw === null) {
                      return;
                    }

                    const nextOrder = Number(nextOrderRaw);
                    if (!Number.isInteger(nextOrder) || nextOrder <= 0) {
                      window.alert(
                        t("components.boardCard.invalidCategoryOrder"),
                      );
                      return;
                    }

                    onEditCategory(category.id, {
                      name: nextName,
                      displayOrder: nextOrder,
                    });
                  }}
                >
                  {t("components.boardCard.editCategory")}
                </button>
                <button
                  className="btn-danger"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      t("components.boardCard.confirmDeleteCategory", {
                        name: category.name,
                      }),
                    );
                    if (!confirmed) {
                      return;
                    }

                    onDeleteCategory(category.id);
                  }}
                >
                  {t("components.boardCard.removeCategory")}
                </button>
              </div>
            )}
            <ul className="list">
              {category.clues.map((clue) => (
                <li key={clue.id} className="clue-admin-item">
                  <div className="clue-admin-text">
                    <strong>{clue.pointValue}</strong> - {clue.prompt}
                    {clue.imageBase64
                      ? ` ${t("components.boardCard.imageTag")}`
                      : ""}
                  </div>
                  <div className="row clue-admin-controls">
                    <span className="clue-admin-status">
                      <span
                        className={`state-pill ${clue.isRevealed ? "is-on" : ""}`}
                      >
                        {t("components.boardCard.revealedLabel")}:{" "}
                        {clue.isRevealed ? t("common.yes") : t("common.no")}
                      </span>
                      <span
                        className={`state-pill ${clue.isAnswered ? "is-on" : ""}`}
                      >
                        {t("components.boardCard.answeredLabel")}:{" "}
                        {clue.isAnswered ? t("common.yes") : t("common.no")}
                      </span>
                    </span>
                    {isDraft && (
                      <>
                        <button
                          className="btn-secondary"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            onStartEditClue({
                              categoryId: category.id,
                              categoryName: category.name,
                              categoryOrder: category.displayOrder,
                              clueId: clue.id,
                              prompt: clue.prompt,
                              answer: clue.answer,
                              pointValue: clue.pointValue,
                              imageMimeType: clue.imageMimeType,
                              imageBase64: clue.imageBase64,
                            });
                          }}
                        >
                          {t("components.boardCard.editQuestion")}
                        </button>
                        <button
                          className="btn-danger"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              t("components.boardCard.confirmDeleteQuestion", {
                                prompt: clue.prompt,
                              }),
                            );
                            if (!confirmed) {
                              return;
                            }

                            onDeleteClue(clue.id);
                          }}
                        >
                          {t("components.boardCard.removeQuestion")}
                        </button>
                      </>
                    )}
                    <button
                      className="btn-secondary"
                      disabled={isBusy}
                      onClick={() => onToggleReveal(clue.id, clue.isRevealed)}
                    >
                      {t("components.boardCard.revealHide")}
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={isBusy}
                      onClick={() => onToggleAnswered(clue.id, clue.isAnswered)}
                    >
                      {t("components.boardCard.markAnswered")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
