<?php
namespace AppBundle\Entity;
/**
 * class: Testing
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 */

use Doctrine\ORM\Mapping as ORM;

/**
 * Banners
 *
 * @ORM\Table(name="banner", options={"comment" = "Промокомпании страни", "collate" = "utf8_general_ci"})
 * @ORM\Entity(repositoryClass="AppBundle\Repository\BannerRepository")
 */
class Testing 
{
	/**
	 * @var integer
	 *
	 * @ORM\Column(name="id", type="integer")
	 * @ORM\Id
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	private $id;
	
	/**
	 * @var string
	 *
	 * @ORM\Column(name="name", type="string", options={"comment" = "название слайда"})
	 */
	private $name;

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set name
     *
     * @param string $name
     *
     * @return Testing
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }
}
