import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UnsavedChangesDialogProps {
  unsaved: { showDialog: boolean; confirmLeave: () => void; cancelLeave: () => void };
}

export function UnsavedChangesDialog({ unsaved }: UnsavedChangesDialogProps) {
  if (!unsaved.showDialog) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dados não salvos</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            Você possui dados não salvos nesta página.{"\n"}
            Se sair agora, perderá as informações digitadas.{"\n\n"}
            Deseja realmente sair?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={unsaved.cancelLeave}>
            Permanecer na página
          </AlertDialogCancel>
          <AlertDialogAction onClick={unsaved.confirmLeave}>
            Sair sem salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
