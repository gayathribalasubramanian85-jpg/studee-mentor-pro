import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
const Toaster = ({ ...props }) => {
    const { theme = "system" } = useTheme();
    return (
        <>
            <style jsx global>{`
                [data-sonner-toaster] [data-close-button] {
                    position: absolute !important;
                    right: 8px !important;
                    top: 8px !important;
                    transform: none !important;
                    left: auto !important;
                    background: transparent !important;
                    border: none !important;
                    width: 20px !important;
                    height: 20px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 10 !important;
                }
                [data-sonner-toaster] [data-close-button]:hover {
                    background: rgba(0, 0, 0, 0.1) !important;
                }
                [data-sonner-toast] {
                    padding-right: 2.5rem !important;
                }
            `}</style>
            <Sonner 
                theme={theme} 
                className="toaster group" 
                duration={5000}
                closeButton={true}
                position="top-right"
                toastOptions={{
                    classNames: {
                        toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                        description: "group-[.toast]:text-muted-foreground",
                        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                        success: "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-800 group-[.toaster]:border-green-200 group-[.toaster]:shadow-green-100",
                        error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 group-[.toaster]:border-red-200 group-[.toaster]:shadow-red-100",
                        warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-800 group-[.toaster]:border-yellow-200 group-[.toaster]:shadow-yellow-100",
                        info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-800 group-[.toaster]:border-blue-200 group-[.toaster]:shadow-blue-100"
                    },
                }} {...props}/>
        </>
    );
};
export { Toaster, toast };
