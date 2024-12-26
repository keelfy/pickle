type Props = {
    children: React.ReactNode;
};

export default async function Layout({ children }: Props) {
    return (
        <div className="h-screen w-full px-4 flex items-center">
            {children}
        </div>
    );
}
